import time
from itertools import product, combinations

current_allocation = [
	{
		"protocol_id": 0,
		"underlying_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
		"interest_rate": .08,
		"amount": 1000000,
		"token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
	},
	{
		"protocol_id": 1,
		"underlying_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
		"interest_rate": .01,
		"amount": 9000000,
		"token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
	},
]

tokens = [
	{
		"protocol_id": 0,
		# "protocol_name": "Aave V3",
		"underlying_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
		"interest_rate": .08,
		"liquidity": 1000000000,
		"token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
	},
	{
		"protocol_id": 1,
		# "protocol_name": "Benqi",
		"underlying_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
		"interest_rate": .12,
		"liquidity": 1000000000,
		"token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
	},
	{
		"protocol_id": 2,
		# "protocol_name": "Anchor",
		"underlying_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
		"interest_rate": .912,
		"liquidity": 1000000000,
		"token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
	},
	{
		"protocol_id": 3,
		# "protocol_name": "Aave V2",
		"underlying_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
		"interest_rate": .112,
		"liquidity": 1000000000,
		"token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
	},
	# {
	# 	"protocol_id": 4,
	# 	"protocol_name": "yoMamma",
	# 	"underlying_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
	# 	"interest_rate": .096,
	# 	"liquidity": 1000000000,
	# 	"token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
	# },
]

allocations = []

current_lowest_rate = 10000
# total amount in aggregator
current_total_amount = 0 
# total amount being returned annually (current_total_amount*weighted_interest_rate)
current_return = 0 
# weighted interest rate
current_rate = 0 
# how many steps to compile per token
# eg steps is percentage of 100
# 1 step is 1% of current_total_amount per allocation
steps = 1

def current_rate_and_return(_current_allocation):
	global current_total_amount
	global current_return
	global current_rate
	global current_lowest_rate

	for allocation in _current_allocation:
		current_total_amount += allocation['amount']
		current_return += allocation['interest_rate'] * allocation['amount']
		if (allocation['interest_rate'] < current_lowest_rate):
			current_lowest_rate = allocation['interest_rate']

	current_rate = current_return / current_total_amount

	return (current_rate, current_return)


# v1

# token_allocation_steps = {}
"""
token_allocation_steps = {
    1: [
        {
            "rate": 1
        }
    ],
	2: [
        {
            "rate": 1
        }
    ],
  
}

"""

# def compile_tokens_steps():
# 	# current_rate, current_return = current_rate_and_return(current_allocation)

# 	for token in tokens:
# 		liquidity = 10000000000000
# 		# liquidity = get_liquidity(token.token_address)

# 		token_allocation_steps[token['protocol_id']] = []

# 		for step in range(steps, 100, steps):
# 			allocation_percentage = step / 100
# 			amount = current_total_amount * allocation_percentage
# 			interest_rate = token['interest_rate']
# 			# interest_rate = get_interest_rate(token.token_address, amount)
# 			annual_return = amount * interest_rate

# 			if amount <= liquidity:
# 				token_allocation_steps[token['protocol_id']].append({
# 									"protocol_id": token['protocol_id'],
# 									"underlying_address": token['underlying_address'],
# 									"token_address": token['token_address'],
# 									"interest_rate": interest_rate,
# 									"annual_return": annual_return,
# 									"allocation_percentage": allocation_percentage
# 								})

# token_allocation_results = []

# def get_all_combinations():
# 	tokens_len = len(token_allocation_steps)

# 	for i in range(tokens_len):
# 		print("i", i)
# 		for token_step in token_allocation_steps[i]:
# 			print("token_step", token_step)

# 			for ii in range(tokens_len):
# 				print("ii", ii)
# 				if i == ii:
# 					pass

# 				for combo in product(token_allocation_steps[i], token_allocation_steps[ii]):
# 					print(combo)

# 					if sum(combo['allocation_percentage'] for item in combo) != 1.0:
# 						pass
# 					else:
# 						token_allocation_results.append(combo)



# v2
token_allocation_steps = []

def compile_tokens_steps():
	# current_rate, current_return = current_rate_and_return(current_allocation)

	for token in tokens:
		liquidity = 10000000000000
		# liquidity = get_liquidity(token.token_address)

		for step in range(steps, 101, steps):
			allocation_percentage = step / 100
			amount = current_total_amount * allocation_percentage
			interest_rate = token['interest_rate']
			# interest_rate = get_interest_rate(token.token_address, amount)
			annual_return = amount * interest_rate

			if amount <= liquidity:
				token_allocation_steps.append({
									"protocol_id": token['protocol_id'],
									# "protocol_name": token['protocol_name'],
									"underlying_address": token['underlying_address'],
									"token_address": token['token_address'],
									"interest_rate": interest_rate,
									"annual_return": annual_return,
									"allocation_percentage": allocation_percentage
								})

token_allocation_combinations_results = []

def check_duplicate(l):
    visited = set()
    has_duplicate = False
    for element in l:
        if element in visited:
            pass
        elif l.count(element) == 1:
            visited.add(element)
        elif l.count(element) > 1:
            has_duplicate = True
            # print("The list contains duplicate elements.")
            break
    if not has_duplicate:
    	return has_duplicate
        # print("List has no duplicate elements.")

    return has_duplicate


count = 0

def get_all_combinations():
	global count
	for x in range(0, len(tokens)):
		print("x is: ", x)
		for combo_list in combinations(token_allocation_steps, r=x):
			# combo_list = list(combo)

			if len(combo_list) == 1:
				for allo in combo_list:
					if allo['allocation_percentage'] != 1.0:
						continue

			protocol_id_list = []

			for allo in combo_list:
				protocol_id_list.append(allo['protocol_id'])


			if len(protocol_id_list) > 1:
				if check_duplicate(protocol_id_list):
					continue

			
			allocation_percentage = 0

			for allo in combo_list:
				allocation_percentage += allo['allocation_percentage']


			if allocation_percentage != 1.0:
				continue

			# print("allocation_percentage", allocation_percentage)

			print("_combo_list_", combo_list)


			# print("allocation_percentage pass", allocation_percentage)
			# print(combo_list)
			count += 1

			token_allocation_combinations_results.append(combo_list)


def run():
	start = time.time()
	# get current allocation data
	current_rate_and_return(current_allocation)

	# compile platforms and steps
	compile_tokens_steps()

	# run each combination
	# 	if allocation beats
	get_all_combinations()

	print(get_all_combinations())

	# token_allocation_sorted = sorted(token_allocation_combinations_results, key=lambda x: (sum(i['annual_return'] for i in x), len), reverse=False)
	token_allocation_sorted = sorted(token_allocation_combinations_results, key=lambda x: (sum(i['annual_return'] for i in x)), reverse=False)
	print("token_allocation_sorted", token_allocation_sorted)

	executionTime = (time.time() - start)
	print('Algorithm took: ' + str(executionTime), "and found ", count, " different allocations")

	print("Results \n ")


run()